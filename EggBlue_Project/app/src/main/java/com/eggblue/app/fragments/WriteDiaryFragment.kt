package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup; import android.widget.Toast
import androidx.fragment.app.Fragment; import com.eggblue.app.databinding.FragmentWriteDiaryBinding; import com.eggblue.app.models.Diary; import com.eggblue.app.utils.FirebaseHelper; import java.util.Calendar
class WriteDiaryFragment : Fragment() {
    private lateinit var binding: FragmentWriteDiaryBinding
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentWriteDiaryBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s)
        val n=Calendar.getInstance(); binding.tvCurrentDate.text="Hôm nay: ${String.format("%02d/%02d/%d",n.get(Calendar.DAY_OF_MONTH),n.get(Calendar.MONTH)+1,n.get(Calendar.YEAR))}"
        binding.btnSaveDiary.setOnClickListener {
            val c=binding.etDiaryContent.text.toString().trim(); if(c.isEmpty()) { Toast.makeText(requireContext(),"Nhập nội dung",Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            FirebaseHelper.getUserDiaryCollection(FirebaseHelper.currentUserUid!!).add(Diary(content=c,day=n.get(Calendar.DAY_OF_MONTH),month=n.get(Calendar.MONTH)+1,year=n.get(Calendar.YEAR),createdAt=System.currentTimeMillis()))
                .addOnSuccessListener{ Toast.makeText(requireContext(),"Đã lưu!",Toast.LENGTH_SHORT).show(); parentFragmentManager.popBackStack() }
        }
    }
}