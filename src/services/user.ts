import { supabase } from "../lib/supabase"
import type { User } from "../types"

export const updateUser = async (userData: Partial<User>): Promise<void> => {
  if (!userData.uuid) {
    throw new Error("ID do usuário não fornecido")
  }

  // Mapear os campos do User para os nomes de colunas no banco de dados
  const dbData: any = {}

  if (userData.name) dbData.name = userData.name
  if (userData.cpf) dbData.cpf = userData.cpf
  if (userData.phone) dbData.phone = userData.phone
  if (userData.email) dbData.email = userData.email
  if (userData.birthDate) dbData.birth_date = userData.birthDate
  if (userData.profession) dbData.profession = userData.profession
  if (userData.paymentComplete !== undefined) dbData.payment_complete = userData.paymentComplete

  const { error } = await supabase.from("profiles").update(dbData).eq("id", userData.uuid)

  if (error) {
    throw error
  }
}
