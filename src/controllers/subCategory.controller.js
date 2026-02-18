import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {updateSubcategorySchema} from "../schema/subcategory.schema.js"



//create subcategory
export const createSubcategory = asyncHandler(async(req,res) => {
    const {name, description, categoryId} = req.body
    if(!(name || description || categoryId)){
        throw new ApiError(400 , "Send all the required detials")
    }

    const category = await prisma.category.findUnique({
        where : {
            id : categoryId
        }
    })

    if(!category){
        throw new ApiError(400,  "Send a valid category id")
    }

    const subcategory = await prisma.subCategory.create({
        data: {
            name: name,
            description: description,
            categoryId : categoryId,
        },
    })

    if (!subcategory){
        throw new ApiError(400, "There is some touble in creating the Subcategroy in prisma")
    }

    res
    .status(200)
    .json(new ApiResponse(200, subcategory, "create the subcategory successfully"))
})
//read category
export const readSubcategoryById = asyncHandler(async(req,res) => {
    const {id } = req.params;

    if(!id ) {
        throw new ApiError(400, "Cannot send the empty id")
    }

    const subcategory = await prisma.subCategory.findUnique({
        where : {
            id : id 
        }
    })

    if(!subcategory){
        throw new ApiError(400, "There is some trouble in getting the data from the db of subcategory")
    }

    res
    .status(200)
    .json(new ApiResponse(200, subcategory, "Fetched the subcate ogry successfully"))
})
//update sub category 
export const updateSubcategory = asyncHandler(async(req,res) => {
    const {id} = req.params

    const subCategoryCheck = await prisma.subCategory.findUnique({
        where : {
            id : id
        }
    })
    if(!subCategoryCheck) {
        throw new ApiError(400, "Send the valid id to update the Subcategory")
    }

    const validateData = updateSubcategorySchema.parse(req.body);

    if(!validateData){
        throw new ApiError(400, "data is not present to update teh subcategory")
    }

    const subCategory = await prisma.subCategory.update({
        where :{
            id : id
        },
        data : validateData
    })

    if(!subCategory){
        throw new ApiError(400, "There is some in updating the subcategory")
    }

    res
    .status(200)
    .json(new ApiResponse(200, subCategory , "Updated the subcategory successfully"))
})
//delete category
export const deleteSubcategory = asyncHandler(async(req,res) => {
    const {id} = req.params

    const category = await prisma.subCategory.findUnique({
        where : {
            id : id
        }
    })

    if(!category){
        throw new ApiError(400, "Send a valid SubCategory Id")
    }

    await prisma.subCategory.delete({
        where: {
            id : id
        }
    })

    res
    .status(200)
    .json(new ApiResponse(200, "Deleted the subcategory successfully"))
})