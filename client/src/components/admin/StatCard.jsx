export default function StatCard({ title, value, subtitle, icon: Icon, trend, iconBg }) {
  return (
    <div className="
      bg-white rounded-2xl p-6 border border-[#E2E8F0]
      shadow-sm hover:shadow-lg hover:shadow-[#0F172A]/8
      transition-all duration-300 hover:-translate-y-0.5
      group cursor-default
    ">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-3">
            {title}
          </p>
          <h3 className="text-3xl font-black text-[#0F172A] mb-2 tracking-tight
            group-hover:text-[#1E293B] transition-colors duration-300">
            {value}
          </h3>
          {subtitle && (
            <p className={`text-xs font-semibold flex items-center gap-1 ${
              trend === 'up'   ? 'text-[#1D9E75]' :
              trend === 'down' ? 'text-[#A76059]' :
              'text-[#64748B]'
            }`}>
              {trend === 'up'   && <span>↑</span>}
              {trend === 'down' && <span>↓</span>}
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
            ${iconBg || 'bg-[#F8FAFC]'}
          `}>
            <Icon className="w-5 h-5 text-[#0F172A]" />
          </div>
        )}
      </div>

      {/* bottom accent line that grows on hover */}
      <div className="mt-4 h-0.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-[#0F172A] to-[#7F77DD] rounded-full transition-all duration-500" />
      </div>
    </div>
  );
}