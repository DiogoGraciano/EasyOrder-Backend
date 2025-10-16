import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePhotoFromUsers1759601703275 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "photo"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "photo" text`);
    }
}
