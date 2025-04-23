import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import json
import sys

# Load order histories JSON file
def load_data(file_path="order_histories.json"):
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)  # Debugging info sent to stderr
        return []

# Create user-item matrix
def create_user_item_matrix(order_histories):
    interactions = []
    for order in order_histories:
        for item in order["items"]:
            interactions.append({
                "userId": order["userId"],
                "itemId": item["itemId"],
                "quantity": item["quantity"]
            })
    df = pd.DataFrame(interactions)
    print(f"User-Item Matrix created: {df.shape}", file=sys.stderr)  # Debugging info sent to stderr
    return df.pivot_table(index="userId", columns="itemId", values="quantity", fill_value=0)

# Get related items using cosine similarity
def get_related_items(item_id, matrix, top_n=5):
    if item_id not in matrix.columns:
        print(f"Item {item_id} not found in matrix columns.", file=sys.stderr)  # Debugging info sent to stderr
        return []
    
    similarity = cosine_similarity(matrix.T)
    similarity_df = pd.DataFrame(similarity, index=matrix.columns, columns=matrix.columns)
    
    related_items = similarity_df[item_id].sort_values(ascending=False)[1:top_n+1]
    return [{"itemId": item, "similarity": score} for item, score in related_items.items()]

if __name__ == "__main__":
    try:
        input_item_id = sys.argv[1]  # Item ID passed from Node.js
        top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 5

        # Load data and create user-item matrix
        order_histories = load_data()
        if not order_histories:
            print("No order histories found", file=sys.stderr)  

        user_item_matrix = create_user_item_matrix(order_histories)

        # Get related items based on the item_id
        recommendations = get_related_items(input_item_id, user_item_matrix, top_n)

        if not recommendations:
            print("No related items found", file=sys.stderr)  

        # Output recommendations as JSON
        print(json.dumps(recommendations))  

    except Exception as e:
        print(f"Error during recommendation generation: {e}", file=sys.stderr)  
