import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateRefreshToken, generateToken } from "../utils/token.js";



  export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
      throw new ApiError(401, "Refresh token is missing !! REQURIED")
    }

    try {
      
      const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id
        }
      })

      if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

      const accessToken = generateToken({id: user.id});
      const newRefreshToken = generateRefreshToken({id: user.id});

      await prisma.user.update({
        where: {id: user.id},
        data : {refreshToken: newRefreshToken}
      })

      const options = {
              httpOnly: true,
              secure: true
          }

      return res.status(200)
      .cookie("accessToken", accessToken, options )
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {accessToken , refreshToken : newRefreshToken},
          "New Access token and refresh token generated"
        )
      )
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token(Catch block)")
    }
  })




export const registerUser = asyncHandler (async (req, res)=> {
  // get the details and verify if they are not empty
  // check if user already exists with that email 
  // hash the password and store the user in the database 
  // return the user details except the password

    
      const {email, password, name} = req.body;

      const existingUser = await prisma.user.findUnique({
        where: {
          email: email
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      })

      if(existingUser){
        throw new ApiError(400, "user already exists")
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: name
        }
      })

      if(!user){
        throw new ApiError(400, "There was some trouble creating the user");
      }

      const accessToken = generateToken({ id: user.id });
  const refreshToken = generateRefreshToken({ id: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  const options = {
    httpOnly: true,
    secure: true, 
  };

      return res.status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, user, "user have been registered successfully")
      )
})


export const login = asyncHandler(async (req, res) => {
  // request the credentials from the user
  // find the user 
  // check the user 
  // match the password 
  // generate the access and refresh token 
  // save refresh token in db
  // save access and refresh token in cookie

  const {email, password} = req.body

  const user = await prisma.user.findUnique({
    where: {email},
  });
  

  if (!user) {
        throw new ApiError(404, "User does not exist")
    }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new ApiError(404, "Incorrect password")
  }

  const accessToken = generateToken({id: user.id})
  const refreshToken = generateRefreshToken({id: user.id})

  const loggedInUser = await prisma.user.update({
    where: { id: user.id },
    data : {refreshToken: refreshToken}
  })

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully"
    )
  )



})

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
      message: "Test user has been registered successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); 
  }
};

