export default function StatCard({ title, value, subtitle, icon: Icon, trend, iconBg }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {subtitle && (
            <p className={`text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            iconBg || 'bg-gray-100'
          }`}>
            <Icon className="w-6 h-6 text-gray-700" />
          </div>
        )}
      </div>
    </div>
  );
}