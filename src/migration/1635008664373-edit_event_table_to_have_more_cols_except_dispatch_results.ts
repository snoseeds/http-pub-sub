import {MigrationInterface, QueryRunner} from "typeorm";

export class editEventTableToHaveMoreColsExceptDispatchResults1635008664373 implements MigrationInterface {
    name = 'editEventTableToHaveMoreColsExceptDispatchResults1635008664373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "finishedProcessing"`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "statusCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "numPendingPublish" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "numPublishedSuccessfully" integer`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "numPublishedUnsuccessfully" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "numPublishedUnsuccessfully"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "numPublishedSuccessfully"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "numPendingPublish"`);
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "statusCode"`);
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "finishedProcessing" boolean NOT NULL DEFAULT false`);
    }

}
