import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.LOCAL_MONGO_URL, {
//       replicaSet: "rs0",
//     });
//     console.log(`Connected to DB ${mongoose.connection.host}`.bgCyan.white);
//   } catch (error) {
//     console.log(`DB Error: ${error}`.bgRed.white);
//     process.exit(1);
//   }
// };

// // export default connectDB;
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.GLOBAL_ATLAS_MONGO_URL);
    console.log(`Connected to DB ${mongoose.connection.host}`.bgCyan.white);
  } catch (error) {
    console.log(`DB Error: ${error}`.bgRed.white);
    process.exit(1);
  }
};

export default connectDB;
