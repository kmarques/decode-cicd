const { app, mongoose } = require("./app");
const request = require("supertest");

test("Create a new note", async () => {
  const response = await request(app)
    .post("/notes")
    .send({
      title: "Test Note",
      content: "This is a test note.",
    })
    .set("Content-Type", "application/json");

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("_id");
  expect(response.body.title).toBe("Test Note");
  expect(response.body.content).toBe("This is a test note.");
});

test("Failed to create a note with missing content", async () => {
  const response = await request(app)
    .post("/notes")
    .send({
      title: "Test Note",
    })
    .set("Content-Type", "application/json");

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("message", "Note can not be empty");
});

afterAll(async () => {
  await mongoose.connection.close();
});
