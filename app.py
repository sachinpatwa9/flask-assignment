from flask import Flask, request ,render_template
from pymongo import MongoClient

app = Flask(__name__)

client = MongoClient("mongodb://localhost:27017")
db = client["todo_db"]
todo_collection = db["todo_items"]

@app.route("/")
def hello_world():
    return render_template("index.html")

@app.route("/submittodoitem", methods=["POST"])
def submit_todo_item():
    item_name = request.form.get("itemName")
    item_description = request.form.get("itemDescription")

    todo_collection.insert_one({
        "itemName": item_name,
        "itemDescription": item_description
    })

    return "To-Do item submitted successfully!"


if __name__ == "__main__":
    app.run(debug=True, port=5000)