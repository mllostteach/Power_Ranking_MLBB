package com.eggblue.app.adapters
import android.graphics.Color; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView; import com.eggblue.app.R; import com.eggblue.app.models.Task
class TaskAdapter(private var list: List<Task>, private val onClick: (Task) -> Unit, private val onAdd: () -> Unit) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    override fun getItemViewType(p: Int) = if(p==0) 0 else 1
    override fun onCreateViewHolder(p: ViewGroup, vt: Int) = if(vt==0) { val v=LayoutInflater.from(p.context).inflate(R.layout.item_task_header,p,false); HeaderVH(v,onAdd) } else { val v=LayoutInflater.from(p.context).inflate(R.layout.item_task,p,false); TaskVH(v,onClick) }
    override fun onBindViewHolder(h: RecyclerView.ViewHolder, p: Int) { if(h is TaskVH) h.bind(list[p-1]) }
    override fun getItemCount() = list.size + 1
    fun updateTasks(nl: List<Task>) { list=nl; notifyDataSetChanged() }
    class HeaderVH(v: View, c: () -> Unit) : RecyclerView.ViewHolder(v) { init { v.setOnClickListener { c() } } }
    class TaskVH(v: View, private val c: (Task) -> Unit) : RecyclerView.ViewHolder(v) {
        private val n: TextView=v.findViewById(R.id.tvTaskName); private val nt: TextView=v.findViewById(R.id.tvTaskNote)
        private val t: TextView=v.findViewById(R.id.tvTaskTime); private val s: TextView=v.findViewById(R.id.tvTaskStatus); private val card: View=v.findViewById(R.id.cardTask)
        fun bind(tk: Task) {
            n.text=tk.name; nt.text=if(tk.note.isNotEmpty()) tk.note else "Không ghi chú"; t.text=String.format("%02d:%02d | %02d/%02d/%d",tk.startHour,tk.startMinute,tk.startDay,tk.startMonth,tk.startYear); s.text=tk.getStatusText()
            card.setCardBackgroundColor(Color.parseColor(tk.getBgColor())); itemView.setOnClickListener { c(tk) }
        }
    }
}