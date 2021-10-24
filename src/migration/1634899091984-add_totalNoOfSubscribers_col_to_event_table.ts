import {MigrationInterface, QueryRunner} from "typeorm";

export class addTotalNoOfSubscribersColToEventTable1634899091984 implements MigrationInterface {
    name = 'addTotalNoOfSubscribersColToEventTable1634899091984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" ADD "totalNoOfSubscribers" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."event" DROP COLUMN "totalNoOfSubscribers"`);
    }

}
