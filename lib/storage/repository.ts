import type { Webinar } from "@/types/webinar";

export interface WebinarRepository {
  list(): Promise<Webinar[]>;
  get(id: string): Promise<Webinar | null>;
  save(webinar: Webinar): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
