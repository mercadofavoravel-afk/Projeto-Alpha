import data from "@/data/projects.json";
export type Project = typeof data[number];
export const projects = data;
export const getProject=(slug:string)=>projects.find(p=>p.slug===slug);
