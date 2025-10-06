import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1759601703272 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "phone" character varying(20),
                "photo" text,
                "cpf" character varying(14),
                "address" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "role" character varying(50) NOT NULL DEFAULT 'user',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "UQ_users_cpf" UNIQUE ("cpf"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
