export interface Turno {
  id: 1 | 2 | 3;
  nome: string;
  horario: string;
}

export const TURNOS: Turno[] = [
  { id: 1, nome: "Turno 1", horario: "06:00h às 13:59h" },
  { id: 2, nome: "Turno 2", horario: "14:00h às 21:59h" },
  { id: 3, nome: "Turno 3", horario: "22:00h às 05:59h" }
];

export interface Point {
  x: number;
  y: number;
}

export interface SubSetorDef {
  id: string;
  nome: string;
  posicao: Point | null;
}

export interface SetorDef {
  id: string;
  nome: string;
  cor: string;
  poligono: Point[];
  subSetores: SubSetorDef[];
}

export interface HCData {
  subSetorId: string;
  operador: number;
  auxiliar: number;
}

export interface TurnoData {
  turnoId: 1 | 2 | 3;
  hc: HCData[];
}

export interface AppConfig {
  versao: string;
  projectName?: string;
  dataExportacao: string;
  imagemCroqui: string;
  imageDimensions: { width: number; height: number };
  setores: SetorDef[];
  turnos: TurnoData[];
}
