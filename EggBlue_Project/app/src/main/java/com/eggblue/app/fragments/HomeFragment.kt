package com.eggblue.app.fragments
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.eggblue.app.adapters.TaskAdapter
import com.eggblue.app.databinding.DialogAddTaskBinding
import com.eggblue.app.databinding.DialogCompleteTaskBinding
import com.eggblue.app.databinding.FragmentHomeBinding
import com.eggblue.app.models.Task
import com.eggblue.app.utils.FirebaseHelper
import java.util.*
class HomeFragment : Fragment() {
    private lateinit var binding: FragmentHomeBinding
    private lateinit var adapter: TaskAdapter
    private val taskList = mutableListOf<Task>()
    private var selDay=0; var selMonth=0; var selYear=0; var selHour=0; var selMin=0; var dateOk=false; var timeOk=false
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding = FragmentHomeBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v, s)
        adapter = TaskAdapter(taskList, { task -> if(task.status==Task.STATUS_IN_PROGRESS) showComplete(task) }, { showAdd() })
        binding.rvTasks.layoutManager = LinearLayoutManager(requireContext()); binding.rvTasks.adapter = adapter
        val uid = FirebaseHelper.currentUserUid ?: return
        FirebaseHelper.getUserTaskCollection(uid).addSnapshotListener { sn, err ->
            if(err!=null) return@addSnapshotListener
            taskList.clear()
            for(d in sn?: emptyList()) {
                val t = d.toObject(Task::class.java).copy(id=d.id)
                if(t.status==Task.STATUS_IN_PROGRESS) {
                    val now=Calendar.getInstance(); val tc=Calendar.getInstance().apply{set(t.startYear,t.startMonth-1,t.startDay,t.startHour,t.startMinute)}
                    if(now.after(tc)) { t.status=Task.STATUS_OVERDUE; d.reference.update("status",2) }
                }
                taskList.add(t)
            }
            taskList.sortWith(compareBy<Task>{it.startYear}.thenBy{it.startMonth}.thenBy{it.startDay}.thenBy{it.startHour}.thenBy{it.startMinute})
            adapter.updateTasks(taskList)
        }
    }
    private fun showAdd() {
        val b = DialogAddTaskBinding.inflate(layoutInflater); val d = AlertDialog.Builder(requireContext()).setView(b.root).setCancelable(false).create()
        dateOk=false; timeOk=false
        b.btnSelectDate.setOnClickListener {
            val c=Calendar.getInstance(); DatePickerDialog(requireContext(),{_,y,m,dy->selDay=dy;selMonth=m+1;selYear=y;dateOk=true;b.tvSelectedDate.text=String.format("%02d/%02d/%d",dy,m+1,y)},c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show()
        }
        b.btnSelectTime.setOnClickListener {
            val c=Calendar.getInstance(); TimePickerDialog(requireContext(),{_,h,m->selHour=h;selMin=m;timeOk=true;b.tvSelectedTime.text=String.format("%02d:%02d",h,m)},c.get(Calendar.HOUR_OF_DAY),c.get(Calendar.MINUTE),true).show()
        }
        b.btnCancel.setOnClickListener { d.dismiss() }
        b.btnSave.setOnClickListener {
            val nm=b.etTaskName.text.toString().trim(); val nt=b.etTaskNote.text.toString().trim()
            if(nm.isEmpty()) { Toast.makeText(requireContext(),"Nhập tên task",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            if(!dateOk||!timeOk) { Toast.makeText(requireContext(),"Chọn ngày giờ",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            val now=Calendar.getInstance(); val tc=Calendar.getInstance().apply{set(selYear,selMonth-1,selDay,selHour,selMin)}
            if(tc.before(now)) { Toast.makeText(requireContext(),"Thời gian không hợp lệ",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            val uid=FirebaseHelper.currentUserUid?:return@setOnClickListener
            FirebaseHelper.getUserTaskCollection(uid).add(Task(name=nm,note=nt,startHour=selHour,startMinute=selMin,startDay=selDay,startMonth=selMonth,startYear=selYear,status=1,createdAt=System.currentTimeMillis()))
                .addOnSuccessListener{ Toast.makeText(requireContext(),"Đã thêm!",Toast.LENGTH_SHORT).show(); d.dismiss() }
                .addOnFailureListener{ Toast.makeText(requireContext(),"Lỗi: ${it.message}",Toast.LENGTH_SHORT).show() }
        }
        d.show()
    }
    private fun showComplete(task: Task) {
        val b = DialogCompleteTaskBinding.inflate(layoutInflater); b.tvTaskInfo.text="Task: ${task.name}\nGhi chú: ${task.note}"
        val d = AlertDialog.Builder(requireContext()).setView(b.root).create()
        b.btnNo.setOnClickListener { d.dismiss() }
        b.btnYes.setOnClickListener {
            val uid=FirebaseHelper.currentUserUid?:return@setOnClickListener
            FirebaseHelper.getUserTaskCollection(uid).document(task.id).update("status",0)
                .addOnSuccessListener{ Toast.makeText(requireContext(),"✅ Hoàn thành!",Toast.LENGTH_SHORT).show(); d.dismiss() }
        }
        d.show()
    }
}