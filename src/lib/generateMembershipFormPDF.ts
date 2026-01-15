/**
 * Gera a FICHA CADASTRAL DE ASSOCIADOS completa seguindo o modelo oficial da AEDUC
 */

import jsPDF from "jspdf"

export interface MembershipFormData {
  userName: string
  signatureDataUrl: string
  date?: string
  cpf?: string
  email?: string
  phone?: string
  profession?: string
  birthDate?: string
  // Campos opcionais que podem não estar disponíveis
  motherName?: string
  rg?: string
  maritalStatus?: string
  address?: string
  addressNumber?: string
  addressComplement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  homePhone?: string
  mobilePhone?: string
  commercialPhone?: string
  whatsapp?: string
  hasDependents?: boolean
  cardNumber?: string
  // Logo da AEDUC (URL ou base64)
  logoUrl?: string
  // Local e data para assinatura
  local?: string
}

export const generateMembershipFormPDF = async (
  data: MembershipFormData,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Criar novo documento PDF (A4)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Configurações
      const margin = 15
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const contentWidth = pageWidth - margin * 2
      let yPosition = margin

      // Função para carregar logo
      const loadLogo = (): Promise<string> => {
        return new Promise((resolveLogo, rejectLogo) => {
          if (data.logoUrl) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              const canvas = document.createElement("canvas")
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext("2d")
              if (ctx) {
                ctx.drawImage(img, 0, 0)
                resolveLogo(canvas.toDataURL("image/png"))
              } else {
                rejectLogo(new Error("Erro ao criar canvas para logo"))
              }
            }
            img.onerror = () => {
              rejectLogo(new Error("Erro ao carregar logo"))
            }
            img.src = data.logoUrl
          } else {
            // Se não houver logo, usar texto como fallback
            resolveLogo("")
          }
        })
      }

      // Carregar logo primeiro
      loadLogo()
        .then((logoDataUrl) => {
          // Função para adicionar cabeçalho
          const addHeader = () => {
            if (logoDataUrl) {
              // Usar logo real
              const logoImg = new Image()
              logoImg.crossOrigin = "anonymous"
              logoImg.onload = () => {
                try {
                  // Dimensões da logo no cabeçalho
                  const logoWidth = 40 // mm
                  const logoHeight = (logoImg.height * logoWidth) / logoImg.width

                  // Adicionar logo no cabeçalho
                  doc.addImage(logoDataUrl, "PNG", margin, yPosition, logoWidth, logoHeight)

                  // Tagline abaixo da logo
                  doc.setFontSize(8)
                  doc.setTextColor(0, 0, 0)
                  doc.setFont("helvetica", "normal")
                  const tagline = "Associação de Reitores, Diretores e Professores de Instituições Educacionais."
                  doc.text(tagline, margin, yPosition + logoHeight + 3, { maxWidth: logoWidth + 10 })

                  // Título principal (direita)
                  doc.setFontSize(18)
                  doc.setFont("helvetica", "bold")
                  doc.setTextColor(0, 0, 0)
                  doc.text("FICHA CADASTRAL DE ASSOCIADOS", pageWidth - margin, yPosition + logoHeight / 2, {
                    align: "right",
                  })

                  yPosition += logoHeight + 10
                  addWatermark(logoDataUrl)
                } catch (error) {
                  reject(error)
                }
              }
              logoImg.onerror = () => {
                // Fallback para texto se logo falhar
                addTextHeader()
              }
              logoImg.src = logoDataUrl
            } else {
              // Fallback para texto se não houver logo
              addTextHeader()
            }
          }

          // Função para adicionar cabeçalho com texto (fallback)
          const addTextHeader = () => {
            // Logo AEDUC (texto estilizado como fallback)
            doc.setFontSize(24)
            doc.setTextColor(0, 51, 102) // Azul escuro
            doc.setFont("helvetica", "bold")
            doc.text("AEDUC", margin, yPosition + 8)

            // Linha decorativa acima do logo
            doc.setLineWidth(1)
            doc.setDrawColor(0, 51, 102)
            doc.line(margin, yPosition, margin + 25, yPosition)

            // Tagline
            doc.setFontSize(8)
            doc.setTextColor(0, 0, 0)
            doc.setFont("helvetica", "normal")
            const tagline = "Associação de Reitores, Diretores e Professores de Instituições Educacionais."
            doc.text(tagline, margin, yPosition + 12, { maxWidth: 50 })

            // Título principal (direita)
            doc.setFontSize(18)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(0, 0, 0)
            doc.text("FICHA CADASTRAL DE ASSOCIADOS", pageWidth - margin, yPosition + 8, {
              align: "right",
            })

            yPosition += 20
            addWatermark("")
          }

          // Função para adicionar marca d'água
          const addWatermark = (logoUrl: string) => {
            // ========== SEÇÃO ENTIDADE ==========
            // Barra cinza
            doc.setFillColor(200, 200, 200)
            doc.rect(margin, yPosition, contentWidth, 6, "F")

            // Texto "Entidade"
            doc.setFontSize(11)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(0, 0, 0)
            doc.text("Entidade", margin + 2, yPosition + 4.5)

            yPosition += 8

            // Nome da entidade (descendo levemente)
            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            const entityName = "Aeduc - Associação de Reitores(As), Diretores(As) e Professores(As) de Instituições Educacionais"
            doc.text(entityName, margin, yPosition + 2, { maxWidth: contentWidth - 30 })

            // Campo Estado (direita)
            doc.setFontSize(9)
            doc.text("Estado:", pageWidth - margin - 25, yPosition)
            // Linha para preencher
            doc.setLineWidth(0.3)
            doc.setDrawColor(0, 0, 0)
            doc.line(pageWidth - margin - 20, yPosition + 1, pageWidth - margin, yPosition + 1)

            yPosition += 10

            // ========== SEÇÃO DADOS DO REQUERENTE ==========
            // Barra cinza
            doc.setFillColor(200, 200, 200)
            doc.rect(margin, yPosition, contentWidth, 6, "F")

            // Texto "DADOS DO REQUERENTE"
            doc.setFontSize(11)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(0, 0, 0)
            doc.text("DADOS DO REQUERENTE", margin + 2, yPosition + 4.5)

            yPosition += 8

            // Watermark do logo
            if (logoUrl) {
              // Usar logo como marca d'água
              const watermarkImg = new Image()
              watermarkImg.crossOrigin = "anonymous"
              watermarkImg.onload = () => {
                try {
                  // Criar canvas para aplicar opacidade
                  const watermarkCanvas = document.createElement("canvas")
                  watermarkCanvas.width = watermarkImg.width
                  watermarkCanvas.height = watermarkImg.height
                  const watermarkCtx = watermarkCanvas.getContext("2d")
                  if (watermarkCtx) {
                    // Aplicar opacidade reduzida
                    watermarkCtx.globalAlpha = 0.05
                    watermarkCtx.drawImage(watermarkImg, 0, 0)
                    const watermarkDataUrl = watermarkCanvas.toDataURL("image/png")

                    // Adicionar marca d'água no centro da página
                    const watermarkWidth = 80 // mm
                    const watermarkHeight = (watermarkImg.height * watermarkWidth) / watermarkImg.width
                    const watermarkX = (pageWidth - watermarkWidth) / 2
                    const watermarkY = (pageHeight - watermarkHeight) / 2

                    doc.addImage(
                      watermarkDataUrl,
                      "PNG",
                      watermarkX,
                      watermarkY,
                      watermarkWidth,
                      watermarkHeight,
                    )
                  }
                } catch (error) {
                  console.warn("Erro ao criar marca d'água com logo:", error)
                }
                continueWithForm()
              }
              watermarkImg.onerror = () => {
                // Fallback para texto se logo falhar
                addTextWatermark()
              }
              watermarkImg.src = logoUrl
            } else {
              // Fallback para texto se não houver logo
              addTextWatermark()
            }

            function addTextWatermark() {
              // Watermark do logo (fundo claro) - usando texto cinza claro
              doc.setFontSize(60)
              doc.setFont("helvetica", "bold")
              doc.setTextColor(230, 230, 230) // Cinza muito claro
              // Colocar watermark no centro da página (área de dados)
              doc.text("AEDUC", pageWidth / 2, pageHeight / 2, { align: "center" })
              continueWithForm()
            }

            function continueWithForm() {
              // Resetar fonte e cor
              doc.setFontSize(9)
              doc.setFont("helvetica", "normal")
              doc.setTextColor(0, 0, 0)

              // Função auxiliar para criar campo de formulário
              const createField = (
                label: string,
                value: string,
                required: boolean = false,
                width: number = contentWidth / 2 - 2,
                x: number = margin,
              ) => {
                const labelText = required ? `*${label}:` : `${label}:`
                doc.setFont("helvetica", "normal")
                doc.setFontSize(9)
                doc.text(labelText, x, yPosition)

                // Linha para preencher
                doc.setLineWidth(0.3)
                doc.setDrawColor(0, 0, 0)
                const lineY = yPosition + 3
                const lineLength = width - 5
                doc.line(x, lineY, x + lineLength, lineY)

                // Valor (se fornecido)
                if (value) {
                  doc.setFontSize(9)
                  doc.text(value, x + 1, yPosition + 2.5, { maxWidth: lineLength - 2 })
                }
              }

              // Primeira linha de campos
              createField("Nome", data.userName || "", true, contentWidth / 2 - 2, margin)
              createField("Nome da Mãe", data.motherName || "", true, contentWidth / 2 - 2, pageWidth / 2 + 2)
              yPosition += 7

              // Segunda linha
              createField("CPF", data.cpf || "", true, contentWidth / 3 - 2, margin)
              createField("RG", data.rg || "", true, contentWidth / 3 - 2, margin + contentWidth / 3)
              createField("Data de Nascimento", data.birthDate ? new Date(data.birthDate).toLocaleDateString("pt-BR") : "", true, contentWidth / 3 - 2, margin + (contentWidth / 3) * 2)
              yPosition += 7

              // Terceira linha
              createField("Estado Civil", data.maritalStatus || "", true, contentWidth / 2 - 2, margin)
              createField("Profissão/Atividade", data.profession || "", true, contentWidth / 2 - 2, pageWidth / 2 + 2)
              yPosition += 7

              // Endereço
              createField("Endereço", data.address || "", true, contentWidth * 0.6, margin)
              createField("Número", data.addressNumber || "", false, contentWidth * 0.15, margin + contentWidth * 0.62)
              createField("Complemento", data.addressComplement || "", false, contentWidth * 0.2, margin + contentWidth * 0.78)
              yPosition += 7

              // Bairro, Cidade/UF, CEP
              createField("Bairro", data.neighborhood || "", true, contentWidth / 3 - 2, margin)
              createField("Cidade / UF", data.city && data.state ? `${data.city} / ${data.state}` : "", true, contentWidth / 3 - 2, margin + contentWidth / 3)
              createField("CEP", data.zipCode || "", true, contentWidth / 3 - 2, margin + (contentWidth / 3) * 2)
              yPosition += 7

              // Telefones
              createField("Telefone Residencial", data.homePhone || data.phone || "", true, contentWidth / 3 - 2, margin)
              createField("Telefone Celular", data.mobilePhone || data.phone || "", true, contentWidth / 3 - 2, margin + contentWidth / 3)
              createField("Telefone Comercial", data.commercialPhone || "", false, contentWidth / 3 - 2, margin + (contentWidth / 3) * 2)
              yPosition += 7

              // WhatsApp e Email
              createField("WhatsApp", data.whatsapp || data.phone || "", false, contentWidth / 2 - 2, margin)
              createField("E-mail", data.email || "", true, contentWidth / 2 - 2, pageWidth / 2 + 2)
              yPosition += 7

              // Possui Dependentes?
              doc.setFontSize(9)
              doc.text("*Possui Dependentes?:", margin, yPosition)
              const circleY = yPosition - 1.5
              doc.circle(margin + 45, circleY, 1.5) // Círculo para Sim
              doc.text("Sim", margin + 48, yPosition)
              doc.circle(margin + 55, circleY, 1.5) // Círculo para Não
              doc.text("Não", margin + 58, yPosition)
              if (data.hasDependents !== undefined && data.hasDependents) {
                // Marcar o círculo "Sim" se tiver dependentes
                doc.circle(margin + 45, circleY, 1.2, "F")
              } else if (data.hasDependents !== undefined && !data.hasDependents) {
                // Marcar o círculo "Não" se não tiver dependentes
                doc.circle(margin + 55, circleY, 1.2, "F")
              }
              yPosition += 7

              // Cartão do Associado e Contribuição
              createField("Cartão do Associado", data.cardNumber || "", false, contentWidth / 2 - 2, margin)
              doc.setFontSize(9)
              doc.text("Contribuição Associativa:", pageWidth / 2 + 2, yPosition)
              doc.setFont("helvetica", "bold")
              doc.text("R$ 5,00 (mensal)", pageWidth / 2 + 2, yPosition + 3)
              yPosition += 10

              // ========== TERMOS E CONDIÇÕES ==========
              doc.setFontSize(10)
              doc.setFont("helvetica", "bold")
              const termsTitle = "Solicito minha Associação á AEDUC na categoria de Associado Beneficiário, estando ciente que:"
              const termsLines = doc.splitTextToSize(termsTitle, contentWidth)
              doc.text(termsLines, margin, yPosition)
              yPosition += termsLines.length * 5 + 3

              doc.setFontSize(9)
              doc.setFont("helvetica", "normal")

              const terms = [
                "1. Tenho direito ao uso dos serviços e benefícios concedidos pela AEDUC, na forma e condições estabelecidas pela Diretoria Executiva, bem como os demais direitos associativos;",
                "2. Pagarei a Contribuição Associativa no valor de R$ 5,00 mensais;",
                "3. O não pagamento da Contribuição Associativa implicará no cancelamento do cadastro e perda do direito ao uso dos benefícios, e o cancelamento do Associado Titular implicará automaticamente na exclusão dos dependentes;",
                "4. A filiação somente será válida após análise e aprovação pela diretoria executiva, não podendo ser utilizados os benefícios antes desta aprovação e filiação;",
                "5. A filiação somente será válida após análise e aprovação pela diretoria executiva, que será formalizada pela expedição da Carteira do Associado, não podendo ser utilizados os benefícios antes desta aprovação e filiação.",
              ]

              terms.forEach((term) => {
                if (yPosition > pageHeight - 40) {
                  doc.addPage()
                  yPosition = margin
                }
                const termLines = doc.splitTextToSize(term, contentWidth)
                doc.text(termLines, margin, yPosition)
                yPosition += termLines.length * 4.5 + 2
              })

              yPosition += 5

              // ========== DECLARAÇÃO E ASSINATURA ==========
              doc.setFontSize(9)
              doc.setFont("helvetica", "normal")
              const declaration = "Pelo presente termo, sob minha inteira responsabilidade, declaro verdadeiro todas as informações prestadas nesta ficha cadastral. Por ser expressão da verdade e da minha vontade, firmo o presente."
              const declarationLines = doc.splitTextToSize(declaration, contentWidth)
              doc.text(declarationLines, margin, yPosition)
              yPosition += declarationLines.length * 5 + 10

              // Linhas para assinatura
              const signatureY = yPosition
              doc.setLineWidth(0.5)
              // Linha Local e data (movendo mais à direita)
              const localDataX = margin + 10
              doc.line(localDataX, signatureY, localDataX + 60, signatureY)
              doc.text("Local e data", localDataX, signatureY - 2)

              doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin, signatureY) // Linha Assinatura
              doc.text("Assinatura do requerente", pageWidth - margin - 60, signatureY - 2)

              yPosition += 15

              // Carregar e adicionar imagem da assinatura
              const signatureImg = new Image()
              
              // Se for dataURL, não precisa de crossOrigin
              if (data.signatureDataUrl?.startsWith("data:image")) {
                signatureImg.crossOrigin = undefined
              } else {
                signatureImg.crossOrigin = "anonymous"
              }

              signatureImg.onload = () => {
                try {
                  // Adicionar assinatura na linha correta (direita)
                  const signatureWidth = 50
                  const signatureHeight = 20
                  const signatureX = pageWidth - margin - signatureWidth
                  const signatureYPos = signatureY - signatureHeight - 2

                  doc.addImage(
                    signatureImg,
                    "PNG",
                    signatureX,
                    signatureYPos,
                    signatureWidth,
                    signatureHeight,
                  )

                  // Adicionar local e data na linha esquerda
                  const localText = data.local || ""
                  const dateText = data.date || new Date().toLocaleDateString("pt-BR")
                  const localDateText = localText ? `${localText}, ${dateText}` : dateText
                  doc.setFontSize(9)
                  doc.setFont("helvetica", "normal")
                  doc.text(localDateText, localDataX, signatureY - 2)

                  // Rodapé com email
                  doc.setFontSize(8)
                  doc.setTextColor(100, 100, 100)
                  doc.text("E-mail: contato@aeducbrasil.com.br", pageWidth / 2, pageHeight - 10, {
                    align: "center",
                  })

                  // Gerar blob do PDF
                  const pdfBlob = doc.output("blob")
                  resolve(pdfBlob)
                } catch (error) {
                  console.error("Erro ao adicionar assinatura no PDF:", error)
                  reject(error)
                }
              }

              signatureImg.onerror = (error) => {
                console.error("Erro ao carregar imagem da assinatura:", error)
                console.error("Tipo de URL:", data.signatureDataUrl?.substring(0, 50))
                reject(new Error("Erro ao carregar imagem da assinatura. Verifique se a assinatura é válida."))
              }

              // Carregar imagem (dataURL ou URL)
              signatureImg.src = data.signatureDataUrl
            }
          }

          // Iniciar processo
          addHeader()
        })
        .catch((error) => {
          reject(error)
        })
    } catch (error) {
      reject(error)
    }
  })
}
