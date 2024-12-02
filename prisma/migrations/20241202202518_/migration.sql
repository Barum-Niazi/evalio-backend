-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "logo_blob_id" INTEGER,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "key_results" ADD COLUMN     "parent_key_result_id" INTEGER;

-- AlterTable
ALTER TABLE "okrs" ADD COLUMN     "parent_okr_id" INTEGER;

-- AlterTable
ALTER TABLE "user_details" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "profile_blob_id" INTEGER;

-- CreateTable
CREATE TABLE "blob" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "audit" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "blob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "audit" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagged_entities" (
    "id" SERIAL NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "reference_id" INTEGER,
    "reference_type" TEXT,
    "metadata" JSONB,
    "audit" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "tagged_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tagged_entities_entity_id_entity_type_idx" ON "tagged_entities"("entity_id", "entity_type");

-- CreateIndex
CREATE INDEX "tagged_entities_reference_id_reference_type_idx" ON "tagged_entities"("reference_id", "reference_type");

-- CreateIndex
CREATE UNIQUE INDEX "tagged_entities_tag_id_entity_id_entity_type_key" ON "tagged_entities"("tag_id", "entity_id", "entity_type");

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_profile_blob_id_fkey" FOREIGN KEY ("profile_blob_id") REFERENCES "blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_logo_blob_id_fkey" FOREIGN KEY ("logo_blob_id") REFERENCES "blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "okrs" ADD CONSTRAINT "okrs_parent_okr_id_fkey" FOREIGN KEY ("parent_okr_id") REFERENCES "okrs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_parent_key_result_id_fkey" FOREIGN KEY ("parent_key_result_id") REFERENCES "key_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagged_entities" ADD CONSTRAINT "tagged_entities_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
