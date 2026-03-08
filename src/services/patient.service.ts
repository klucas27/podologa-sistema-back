import { prisma } from "../lib";
import type { Patient } from "@prisma/client";

const getPatientById = async (id: string): Promise<Patient | null> => {
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  return patient;
};

export { getPatientById };
