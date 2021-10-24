import {MigrationInterface, QueryRunner} from "typeorm";

export class initialDatabase1634862065790 implements MigrationInterface {
    name = 'initialDatabase1634862065790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "topic" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "name" character varying(300) NOT NULL, "publishedEventsCount" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_15f634a2dbf62a79bb726fc6158" UNIQUE ("name"), CONSTRAINT "PK_33aa4ecb4e4f20aa0157ea7ef61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "dataJSON" character varying NOT NULL, "topicId" uuid, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscriber" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "url" character varying(300) NOT NULL, CONSTRAINT "UQ_091c88c1c4b495c7dbb7154603b" UNIQUE ("url"), CONSTRAINT "PK_1c52b7ddbaf79cd2650045b79c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE DEFAULT now(), "subscriberAndTopic" character varying NOT NULL, "subscriberId" uuid, "topicId" uuid, CONSTRAINT "UQ_d4cab535e82b65065a1209f572b" UNIQUE ("subscriberAndTopic"), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_54ce7ed85b36a03f72a22eac725" FOREIGN KEY ("topicId") REFERENCES "topic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_95a175097e883d7d1deb5780c62" FOREIGN KEY ("subscriberId") REFERENCES "subscriber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_11ae921cfdf6d1462b26ff390e5" FOREIGN KEY ("topicId") REFERENCES "topic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_11ae921cfdf6d1462b26ff390e5"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_95a175097e883d7d1deb5780c62"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_54ce7ed85b36a03f72a22eac725"`);
        await queryRunner.query(`DROP TABLE "subscription"`);
        await queryRunner.query(`DROP TABLE "subscriber"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "topic"`);
    }

}
