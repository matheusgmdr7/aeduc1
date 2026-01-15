import type React from "react"
import { Bell, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

interface AdminHeaderProps {
  title: string
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title }) => {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
          <Bell className="h-6 w-6" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user?.name.split(" ")[0]}</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader

