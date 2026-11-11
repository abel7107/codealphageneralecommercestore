-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "storeName" TEXT NOT NULL DEFAULT 'Shopora',
    "storeDescription" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);
