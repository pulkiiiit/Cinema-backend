/*
  Warnings:

  - You are about to drop the column `image` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `profileimage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Variant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "rating" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileimage",
ADD COLUMN     "profileimageUrl" TEXT;

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "color" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL;
