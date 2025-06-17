import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Entre em Contato</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos à disposição para atender suas dúvidas, sugestões e solicitações.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Envie uma Mensagem</h2>
            <form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu.email@exemplo.com"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Assunto da mensagem"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite sua mensagem aqui..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-900 text-white py-3 px-4 rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center"
              >
                <Send className="h-5 w-5 mr-2" /> Enviar Mensagem
              </button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div>
            <div className="bg-blue-900 text-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Informações de Contato</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Endereço</h3>
                    <p className="text-blue-100">Rua Roberto Simonsen, 72</p>
                    <p className="text-blue-100">Sé, São Paulo - SP</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Telefone</h3>
                    <p className="text-blue-100">(11) 2626-7663</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">E-mail</h3>
                    <p className="text-blue-100">contato@aeducbrasil.com.br</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Horário de Atendimento</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium">Segunda a Sexta</span>
                  <span>9h às 18h</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-medium">Sábado</span>
                  <span>9h às 13h</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Domingo e Feriados</span>
                  <span>Fechado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Como me torno um associado?</h3>
              <p className="text-gray-700">
                Para se tornar um associado, basta realizar o cadastro em nosso site. Após a confirmação do cadastro, você receberá sua carteira de associado e terá acesso a todos os benefícios.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Quem pode se associar à AEDUC?</h3>
              <p className="text-gray-700">
                Podem se associar à AEDUC reitores, diretores, coordenadores, professores e estudantes universitários.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Como acesso os benefícios exclusivos?</h3>
              <p className="text-gray-700">
                Após se tornar um associado, você terá acesso à área restrita do site, onde poderá consultar todos os benefícios disponíveis e como utilizá-los. Alguns benefícios são acessados mediante apresentação da carteira de associado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;