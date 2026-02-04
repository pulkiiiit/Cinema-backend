import { prisma } from "../../lib/prisma.js";

export const createTestUser = async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        name: "pulkit test",
        email: "pulkit@test.com",
        password: "test1234",
      },
    });
    res.status(201).json({
      message: "Test User Created Successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); 
  }
};
