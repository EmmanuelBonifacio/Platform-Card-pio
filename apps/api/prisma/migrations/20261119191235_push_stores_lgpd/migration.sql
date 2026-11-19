-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "store_location_id" TEXT;

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_locations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "address_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "push_subscriptions_tenant_id_idx" ON "push_subscriptions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_tenant_id_endpoint_key" ON "push_subscriptions"("tenant_id", "endpoint");

-- CreateIndex
CREATE INDEX "store_locations_tenant_id_is_active_idx" ON "store_locations"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "store_locations_tenant_id_slug_key" ON "store_locations"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "orders_tenant_id_store_location_id_idx" ON "orders"("tenant_id", "store_location_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_location_id_fkey" FOREIGN KEY ("store_location_id") REFERENCES "store_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_locations" ADD CONSTRAINT "store_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
