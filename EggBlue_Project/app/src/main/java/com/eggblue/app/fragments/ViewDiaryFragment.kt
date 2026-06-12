package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup
import androidx.fragment.app.Fragment; import com.eggblue.app.databinding.FragmentViewDiaryBinding; import com.eggblue.app.models.Diary
class ViewDiaryFragment : Fragment() {
    private lateinit var binding: FragmentViewDiaryBinding
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentViewDiaryBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s)
        val d=arguments?.getSerializable("diary") as? Diary ?: return
        binding.tvDiaryDate.text="📅 ${String.format("%02d/%02d/%d",d.day,d.month,d.year)}"; binding.tvDiaryContent.text=d.content
    }
}