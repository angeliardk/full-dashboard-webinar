export interface HeroChampionEntry {
  name: string;
  unit: string;
  /** Award category, if the organizers assigned one -- optional, shown only when present. */
  category?: string;
  /** Short contribution summary, if the organizers provided one -- optional, shown only when present. */
  contribution?: string;
}

/**
 * Official "Nuclear Awareness Hero Champions" recipients for the Webinar
 * Series #1-6, as decided and approved by PLN & ECADIN -- NOT derived from
 * Top 5 Overall Learning Performance or any other computed ranking. This is
 * a manual record of a real-world decision; update it by hand only when the
 * organizers announce a new final list, and never auto-populate entries
 * here from a leaderboard to make the two line up.
 *
 * Last confirmed: Webinar #1-6 series, final list approved by PLN-ECADIN.
 */
export const HERO_CHAMPIONS: HeroChampionEntry[] = [
  { name: "Prida Erni Kesuma", unit: "Divisi Manajemen Risiko Strategis, Regulasi dan Kebijakan, PLN" },
  { name: "I Gusti Ngurah Agung Sutrisna Dwi Putra", unit: "PLN UIT Jawa Bagian Timur dan Bali" },
  { name: "Bayu Agustrio", unit: "PLN UID S2JB" },
];

export const HERO_CHAMPIONS_NOTE =
  "Hero Awareness Champions dipilih berdasarkan konsistensi partisipasi, perkembangan hasil pembelajaran, serta kualitas kontribusi dan feedback sepanjang rangkaian Webinar Nuclear Awareness. Daftar ini adalah keputusan resmi PLN & ECADIN, bukan hasil perankingan otomatis dari data.";
