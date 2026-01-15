/**
 * Gera a ficha associativa completa (texto da proposta + assinatura) como imagem
 */

export interface MembershipFormData {
  userName: string
  signatureDataUrl: string
  date?: string
}

export const generateMembershipFormImage = async (
  data: MembershipFormData,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Criar canvas para o documento completo
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Não foi possível criar contexto do canvas"))
        return
      }

      // Configurar dimensões do canvas (A4 em pixels a 96 DPI)
      const width = 794 // A4 width em pixels
      const height = 1123 // A4 height em pixels
      canvas.width = width
      canvas.height = height

      // Cor de fundo branco
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      // Configurar fonte e estilo
      ctx.fillStyle = "#000000"
      ctx.font = "bold 20px Arial, sans-serif"

      // Título
      const title = "PROPOSTA DE ADESÃO À ASSOCIAÇÃO AEDUC"
      ctx.textAlign = "center"
      ctx.fillText(title, width / 2, 80)

      // Resetar alinhamento
      ctx.textAlign = "left"
      ctx.font = "14px Arial, sans-serif"

      // Texto da proposta
      const lineHeight = 24
      let yPosition = 140
      const margin = 60
      const maxWidth = width - margin * 2

      const proposalText = [
        `Eu, ${data.userName}, solicito minha adesão como associado à Associação de Reitores,`,
        "Diretores e Professores de Instituições Educacionais (AEDUC), declarando conhecer e",
        "aceitar o Estatuto Social e o Regimento Interno da entidade.",
        "",
        "Comprometo-me a:",
        "1. Cumprir as disposições estatutárias e regimentais da AEDUC;",
        "2. Acatar as decisões da Diretoria e das Assembleias;",
        "3. Manter em dia minhas contribuições associativas;",
        "4. Zelar pelo bom nome da Associação.",
        "",
        "Estou ciente de que:",
        "- A taxa associativa é de R$ 39,90 mensais;",
        "- Os benefícios são válidos enquanto eu mantiver minha condição de associado ativo;",
        "- Posso solicitar meu desligamento a qualquer momento, mediante comunicação por escrito.",
        "",
        `Data: ${data.date || new Date().toLocaleDateString("pt-BR")}`,
      ]

      // Desenhar texto linha por linha
      proposalText.forEach((line) => {
        if (line.trim() === "") {
          yPosition += lineHeight / 2
          return
        }

        // Quebrar linha se necessário
        const words = line.split(" ")
        let currentLine = ""

        words.forEach((word) => {
          const testLine = currentLine + word + " "
          const metrics = ctx.measureText(testLine)
          const testWidth = metrics.width

          if (testWidth > maxWidth && currentLine !== "") {
            ctx.fillText(currentLine, margin, yPosition)
            yPosition += lineHeight
            currentLine = word + " "
          } else {
            currentLine = testLine
          }
        })

        if (currentLine) {
          ctx.fillText(currentLine, margin, yPosition)
          yPosition += lineHeight
        }
      })

      // Espaço antes da assinatura
      yPosition += 40

      // Título da seção de assinatura
      ctx.font = "bold 14px Arial, sans-serif"
      ctx.fillText("Assinatura:", margin, yPosition)
      yPosition += 30

      // Carregar e desenhar a assinatura
      const signatureImg = new Image()
      signatureImg.crossOrigin = "anonymous"

      signatureImg.onload = () => {
        try {
          // Desenhar assinatura (ajustar tamanho se necessário)
          const signatureHeight = 120
          const signatureWidth = (signatureImg.width / signatureImg.height) * signatureHeight
          const signatureX = margin
          const signatureY = yPosition

          ctx.drawImage(signatureImg, signatureX, signatureY, signatureWidth, signatureHeight)

          // Linha para assinatura
          ctx.strokeStyle = "#000000"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(signatureX, signatureY + signatureHeight + 5)
          ctx.lineTo(signatureX + 300, signatureY + signatureHeight + 5)
          ctx.stroke()

          // Converter canvas para data URL
          const dataUrl = canvas.toDataURL("image/png")
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      }

      signatureImg.onerror = () => {
        reject(new Error("Erro ao carregar imagem da assinatura"))
      }

      signatureImg.src = data.signatureDataUrl
    } catch (error) {
      reject(error)
    }
  })
}

