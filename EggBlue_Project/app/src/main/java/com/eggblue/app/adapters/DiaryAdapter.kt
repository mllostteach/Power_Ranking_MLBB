package com.eggblue.app.adapters
import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView; import com.eggblue.app.R; import com.eggblue.app.models.Diary
class DiaryAdapter(private var list: List<Diary>, private val onClick: (Diary) -> Unit) : RecyclerView.Adapter<DiaryAdapter.VH>() {
    override fun onCreateViewHolder(p: ViewGroup, vt: Int) = VH(LayoutInflater.from(p.context).inflate(R.layout.item_diary,p,false), onClick)
    override fun onBindViewHolder(h: VH, p: Int) = h.bind(list[p])
    override fun getItemCount() = list.size
    fun updateDiaries(nl: List<Diary>) { list=nl; notifyDataSetChanged() }
    class VH(v: View, private val c: (Diary) -> Unit) : RecyclerView.ViewHolder(v) {
        private val d: TextView=v.findViewById(R.id.tvDiaryDate); private val p: TextView=v.findViewById(R.id.tvDiaryPreview)
        fun bind(di: Diary) { d.text=String.format("%02d/%02d/%d",di.day,di.month,di.year); p.text=if(di.content.length>50) di.content.substring(0,50)+"..." else di.content; itemView.setOnClickListener { c(di) }
    }
}