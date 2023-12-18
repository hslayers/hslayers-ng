export type AboutLayman = {
  about: {
    applications: {
      layman: {
        version: string;
        releaseTimestamp: string; //DateTime
      };
      laymanTestClient: {
        version: string;
      };
    };
    data: {
      layman: {
        lastSchemaMigration: string;
        lastDataMigration: string;
      };
    };
  };
};
