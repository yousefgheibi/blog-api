-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "authorId" INTEGER;

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
