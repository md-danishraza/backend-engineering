const request = require("supertest");
const app = require("./app");

describe("Calculator API", () => {
  it("GET /add should sum two numbers", async () => {
    const response = await request(app).get("/add?a=5&b=10");

    // We expect a 200 OK status
    expect(response.statusCode).toBe(200);
    // We expect the JSON body to be { result: 15 }
    expect(response.body).toEqual({ result: 15 });
  });

  it("GET /add should return 400 if input is missing", async () => {
    const response = await request(app).get("/add?a=5"); // Missing 'b'
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Missing parameters" });
  });
});
