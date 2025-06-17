export interface User {
  id: string // ID curto para exibição (últimos 5 dígitos do UUID ou display_id)
  uuid?: string // UUID completo do Supabase para operações internas (opcional)
  name: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  profession: string
  paymentComplete: boolean
  registrationDate: string
}

