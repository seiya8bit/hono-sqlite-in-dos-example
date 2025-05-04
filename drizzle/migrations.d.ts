
interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version?: string;
  dialect?: string;
  entries: JournalEntry[];
}

interface MigrationConfigData {
  journal: Journal;
  migrations: Record<string, string>;
}

declare const migrationConfig: MigrationConfigData;
export default migrationConfig;
