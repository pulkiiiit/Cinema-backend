/*
  Warnings:

  - You are about to drop the column `minorAmount` on the `Coupon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "minorAmount",
ADD COLUMN     "minimumCartAmount" DOUBLE PRECISION;
