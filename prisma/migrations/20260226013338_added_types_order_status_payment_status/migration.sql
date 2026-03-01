/*
  Warnings:

  - Changed the type of `orderPaymentStatus` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderDeliveryStatus` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "orderStatusType" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "orderPaymentStatusTypes" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "orderPaymentStatus",
ADD COLUMN     "orderPaymentStatus" "orderStatusType" NOT NULL,
DROP COLUMN "orderDeliveryStatus",
ADD COLUMN     "orderDeliveryStatus" "orderPaymentStatusTypes" NOT NULL;
