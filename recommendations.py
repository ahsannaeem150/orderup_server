import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import json
import sys

# Load order histories JSON file
def load_data(file_path="order_histories.json"):
    with open(file_path, "r") as file:
        return json.load(file)

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
    return df.pivot_table(index="userId", columns="itemId", values="quantity", fill_value=0)

# Get related items using cosine similarity
def get_related_items(item_id, matrix, top_n=5):
    if item_id not in matrix.columns:
        return []
    similarity = cosine_similarity(matrix.T)
    similarity_df = pd.DataFrame(similarity, index=matrix.columns, columns=matrix.columns)
    related_items = similarity_df[item_id].sort_values(ascending=False)[1:top_n+1]
    return [{"itemId": item, "similarity": score} for item, score in related_items.items()]

if __name__ == "__main__":
    input_item_id = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 5

    order_histories = load_data()
    user_item_matrix = create_user_item_matrix(order_histories)
    recommendations = get_related_items(input_item_id, user_item_matrix, top_n)
    
    print(json.dumps(recommendations))
