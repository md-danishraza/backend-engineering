// product.test.js
const request = require("supertest");
const app = require("./app");

describe("Product API", () => {
  it("POST /products --> should create a new product", async () => {
    // demo request to app
    const response = await request(app).post("/products").send({
      name: "Gaming Mouse",
      price: 50,
    });

    // We expect "Created" status
    expect(response.statusCode).toBe(201);

    // We expect the response to have an ID (mocking database behavior)
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Gaming Mouse");
  });

  it("POST /products --> should validate price is positive", async () => {
    const response = await request(app).post("/products").send({
      name: "Bad Product",
      price: -100, // Invalid Price
    });

    // We expect the server to stop this
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Price must be positive");
  });

  // product.test.js
  it("GET /products/:id --> should return 404 if product not found", async () => {
    const response = await request(app).get("/products/9999"); // ID that doesn't exist
    expect(response.statusCode).toBe(404);
  });
});
