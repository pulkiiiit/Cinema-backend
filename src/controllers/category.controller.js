import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {updateCategorySchema} from "../schema/category.schema.js"


// create category
export const createCategory = asyncHandler(async(req, res)=> {
    const {name , description, subCategories = []} = req.body

    if (!(name || description || image || subCategories)) {
        throw new ApiError(400, "Send all the required fields")
    }   

    const imageLoaclPath = req.files?.image[0]?.path;

    if (!imageLoaclPath) {
        throw new ApiError(400, "Image is requried" )
    }
    const image  = await uploadOnCloudinary(imageLoaclPath)

    if(!image){
        throw new ApiError(400, "There is some error in uploading the image to cloudinary")
    }

    const category = await prisma.category.create({
        data: {
            name : name,
            description: description,
            image: image.url,
            subCategories : {
                create: subCategories.map((sub) => ({
                    name: sub.name
                }))
            }
        },
        include: {
            subCategories: true
        }
    })

    if (!category) {
        throw new ApiError(400, "There is some trouble while uploading the user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, category, "successfully created the category"))

})


// read category
export const getCategoryById = asyncHandler(async(req, res)=> {
    
    const { id } = req.params

    if (!id) {
        throw new ApiError(400, "Send the Id")
    }

    const category = await prisma.category.findUnique({
        where : {
            id: id
        },
        include : {
            subCategories : true
        }
    })

    if(!category){
        throw new ApiError(400, "There is some trouble while getting the categroy from the data base or it doesn't exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, category, "fetched the category successfully"))

})


// update category
export const updateCategory = asyncHandler(async(req, res)=> {

    const {id} = req.params 

    if (!id){
        throw new ApiError(400, "Send a an id to update the category")
    }

    const validateData = updateCategorySchema.parse(req.body);

    const updatedata = {
        ...validateData,
    }


    const localFilePath = req.files?.image[0]?.path

    if(localFilePath){
        const image = await uploadOnCloudinary(localFilePath);

        if(!image){
            throw new ApiError(400, "There is some error while uploaed the image to clodinary")
        }

        updatedata.image =  image.url
    }

    console.log(updatedata)


    const updatedCategory = await prisma.category.update({
        where: {
            id
        },
        data : updatedata,
    });

    if (!updatedCategory){
        throw new ApiError(400, "There is some error while updating the category to the daabase")
    }

    res
    .status(200)
    .json(new ApiResponse(200, updatedCategory , "updated the category successfully"))


})


// delete category
export const deleteCategory = asyncHandler(async(req, res)=> {
    const{id} = req.params

    if(!id){
        throw new ApiError(400,"send a id to delete the category")
    }

    await prisma.category.delete({
        where:{id}
    })

    res.status(200).json(new ApiResponse(200, "Deleted the category successfully "))
})


// get all product in the category 
export const getAllProductsByCategoryId = asyncHandler(async(req, res)=> {})


// get all subcategory in the category
export const getAllSubcategoryByCategoryId = asyncHandler(async(req, res)=> {})