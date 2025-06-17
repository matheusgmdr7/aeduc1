"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, Briefcase, Building, Award, ArrowRight } from "lucide-react"

// Sample partner data - replace with your actual partners
const partners = [
  {
    id: 1,
    name: "Unimed Porto Alegre",
    logo: "https://i.ibb.co/Ldck22c8/Unimed-Poa.png",
    description: "",
  },
  {
    id: 2,
    name: "Unimed Natal",
    logo: "https://i.ibb.co/wZspVqNQ/Unimed-Natal.png",
    description: "",
  },
  {
    id: 3,
    name: "Unimed João Pessoa",
    logo: "https://i.ibb.co/BVRwhS3h/Unimed-JP.png",
    description: "",
  },
  {
    id: 4,
    name: "Unimed Três Rios",
    logo: "https://i.ibb.co/nNQ5MMrK/Unimed-Tres-rios.png",
    description: "",
  },
  {
    id: 5,
    name: "Unimed Seguros",
    logo: "https://i.ibb.co/04WPWdW/Unimed-Seguros.png",
    description: "",
  },
  {
    id: 6,
    name: "Centro de Pesquisa",
    logo: "/placeholder.svg?height=120&width=240",
    description: "",
  },
  {
    id: 7,
    name: "Unimed Odonto",
    logo: "/placeholder.svg?height=120&width=240",
    description: "",
  },
  {
    id: 8,
    name: "Unimed Odonto",
    logo: "/placeholder.svg?height=120&width=240",
    description: "",
  },
]

// Featured partners section data
const featuredPartners = [
  {
    id: 1,
    name: "Faculdade Estácio",
    logo: "https://i.ibb.co/hJZRVCTM/CARTA-O-DE-BENEFI-CIOS-2.png",
    description:
      "Uma das maiores redes de ensino superior do país, oferecendo benefícios exclusivos para associados AEDUC.",
    benefits: [
      "Descontos em cursos de graduação e pós-graduação",
      "Acesso à biblioteca e instalações",
      "Eventos exclusivos",
    ],
  },
  {
    id: 2,
    name: "Alfa Corretora",
    logo: "https://i.ibb.co/twWMP58J/CARTA-O-DE-BENEFI-CIOS-1.png",
    description:
      "Corretora especializada em seguros para profissionais da educação, com condições especiais para associados.",
    benefits: ["Seguros com valores diferenciados", "Consultoria personalizada", "Atendimento prioritário"],
  },
  {
    id: 3,
    name: "Ideal Grow",
    logo: "https://i.ibb.co/R5d71Fx/Captura-de-Tela-2025-03-11-a-s-01-25-02.png",
    description: "Empresa de tecnologia e gestão com soluções inovadoras a sua empresa.",
    benefits: ["Sistemas de gestão educacional", "Consultoria tecnológica", "Soluções personalizadas"],
  },
]

const OurPartnerships: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate how many partners to show based on screen size
  const [itemsPerSlide, setItemsPerSlide] = useState(3)

  // Update items per slide based on window size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerSlide(1)
      } else if (window.innerWidth < 1024) {
        setItemsPerSlide(2)
      } else {
        setItemsPerSlide(3)
      }
    }

    handleResize() // Initial call
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate total number of slides
  const totalSlides = Math.ceil(partners.length / itemsPerSlide)

  // Autoplay functionality
  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides)
      }, 5000)
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [autoplay, totalSlides, itemsPerSlide])

  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  // Pause autoplay on hover
  const handleMouseEnter = () => setAutoplay(false)
  const handleMouseLeave = () => setAutoplay(true)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Nossas Parcerias</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Nossas parcerias para oferecer os melhores beneficios para os nossos associados
            </p>
          </div>
        </div>
      </section>

      {/* Partners Carousel */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4"></h2>
          </div>

          <div
            className="relative overflow-hidden py-8"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${(currentSlide * 100) / totalSlides}%)` }}
            >
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex-none w-full sm:w-1/2 lg:w-1/3 px-4"
                  style={{ width: `${100 / itemsPerSlide}%` }}
                >
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full flex flex-col items-center justify-center border border-gray-200 hover:shadow-lg transition-shadow">
                    <img
                      src={partner.logo || "/placeholder.svg"}
                      alt={`${partner.name} logo`}
                      className="h-16 sm:h-24 object-contain mb-4"
                    />
                    <h3 className="text-lg sm:text-xl font-semibold text-blue-900 text-center">{partner.name}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 sm:p-2 shadow-md hover:bg-gray-100 focus:outline-none z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-blue-900" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 sm:p-2 shadow-md hover:bg-gray-100 focus:outline-none z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-blue-900" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-3 w-3 mx-1 rounded-full ${currentSlide === index ? "bg-blue-900" : "bg-gray-300"}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Partners */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Parceiros em Destaque</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Conheça mais sobre algumas de nossas principais parcerias e os benefícios exclusivos oferecidos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredPartners.map((partner) => (
              <div key={partner.id} className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-center h-40">
                  <img
                    src={partner.logo || "/placeholder.svg"}
                    alt={`${partner.name} logo`}
                    className={`max-h-full max-w-full ${partner.id === 1 || partner.id === 2 ? "w-full h-full object-cover" : "object-contain"}`}
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2">{partner.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">{partner.description}</p>
                  <h4 className="font-medium text-blue-800 mb-2">Benefícios:</h4>
                  <ul className="space-y-1 mb-4">
                    {partner.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-6">Por que ser um parceiro AEDUC?</h2>
              <p className="text-gray-600 mb-6">
                Ao se tornar um parceiro AEDUC, sua instituição ganha acesso a uma comunidade de profissionais da
                educação altamente qualificados e engajados.
              </p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Visibilidade Institucional</h3>
                    <p className="text-sm text-gray-600">
                      Exposição da sua marca para milhares de profissionais da educação em todo o Brasil.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Networking Estratégico</h3>
                    <p className="text-sm text-gray-600">
                      Conexão direta com instituições educacionais e tomadores de decisão no setor.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Credibilidade e Reconhecimento</h3>
                    <p className="text-sm text-gray-600">
                      Associação com uma entidade respeitada no meio educacional, fortalecendo sua marca.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/partnership"
                  className="inline-flex items-center px-6 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                >
                  Torne-se um Parceiro
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Depoimentos de Parceiros</h3>

              <div className="space-y-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="italic text-gray-700 mb-3">
                    "A parceria com a AEDUC tem sido fundamental para o crescimento da nossa instituição. O acesso a
                    profissionais qualificados e o networking estratégico nos proporcionaram novas oportunidades de
                    negócio."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold mr-3">
                      RC
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Roberto Campos</p>
                      <p className="text-sm text-gray-600">Diretor - Instituto Educacional</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="italic text-gray-700 mb-3">
                    "Desde que nos tornamos parceiros da AEDUC, notamos um aumento significativo na procura por nossos
                    serviços. A visibilidade que ganhamos junto aos profissionais da educação superou nossas
                    expectativas."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold mr-3">
                      MS
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Maria Silva</p>
                      <p className="text-sm text-gray-600">Coordenadora - Faculdade Inovação</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Junte-se aos nossos parceiros</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Faça parte da nossa rede de parceiros e conecte-se com milhares de profissionais da educação em todo o
            Brasil.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/partnership"
              className="px-8 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-md font-medium text-lg inline-block transition-colors"
            >
              Seja um Parceiro
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-blue-800 text-white hover:bg-blue-700 rounded-md font-medium text-lg inline-block transition-colors border border-blue-600"
            >
              Fale Conosco
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default OurPartnerships

