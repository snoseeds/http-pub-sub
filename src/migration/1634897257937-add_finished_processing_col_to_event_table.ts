import {MigrationInterface, QueryRunner} from "typeorm";

export class addFinishedProcessingColToEventTable1634897257937 implements MigrationInterface {
    name = 'addFinishedProcessingColToEventTable1634897257937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "finishedProcessing" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "finishedProcessing"`);
    }

}
