import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler( async (req, res, next) => {
    
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // this line below will be used in the controllers to get the user details from the token and how is it doing that you ask 
        // so basically while creating the access token the info that we pass in it as the payload is stored here 
        // example id , name , email and then we can use these details in every protected apis to call the user details from
        //  the token and then we can use these details to get the user from the database and then we can use these details to 
        // check if the user is authorized to access the resource or not


        req.user = decodedToken;

        next();
        
    } catch (error) {
        throw new ApiError(401, "Invalid Access Token")        
    }

    
})