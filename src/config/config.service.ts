// src/config/config.service.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import path from "path"

const MODE = 'DEV'; // DEV, PROD
// const MODE = 'TEST';

const envResolver = {
  prod(): void {
    // Do what's required by the prod platform
  },
  test(): void {
    require('dotenv').config({ path: require('find-config')('.env.test') })
    // require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') })
  },
  dev(): void {
    require('dotenv').config();
  }
}

/**
 * Load environment variables
 */
envResolver[MODE.toLowerCase()]();


class ConfigService {

  constructor(private env: { [k: string]: string | undefined }) { }

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach(k => this.getValue(k, true));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public isProduction() {
    const mode = this.getValue('MODE', false);
    return mode == 'PROD';
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',

      host: this.getValue('POSTGRES_HOST'),
      port: parseInt(this.getValue('POSTGRES_PORT')),
      username: this.getValue('POSTGRES_USER'),
      password: this.getValue('POSTGRES_PASSWORD'),
      database: this.getValue('POSTGRES_DATABASE'),

      entities: [join(__dirname, '../domain/model', '*.entity.{ts,js}')],

      migrationsTableName: 'migration',

      migrations: ['src/migration/*.ts'],

      cli: {
        migrationsDir: 'src/migration',
      },

      ssl: this.isProduction(),
    };
  }

}

const configService = new ConfigService(process.env)
  .ensureValues([
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'EVENTS_LOG_DIR'
  ]);

export { configService };
