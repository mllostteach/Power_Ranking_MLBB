package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup
import androidx.fragment.app.Fragment; import androidx.recyclerview.widget.LinearLayoutManager
import com.eggblue.app.adapters.DiaryAdapter; import com.eggblue.app.databinding.FragmentDiaryBinding; import com.eggblue.app.models.Diary; import com.eggblue.app.utils.FirebaseHelper
class DiaryFragment : Fragment() {
    private lateinit var binding: FragmentDiaryBinding; private lateinit var adapter: DiaryAdapter; private val list = mutableListOf<Diary>()
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentDiaryBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s)
        adapter = DiaryAdapter(list) { d -> parentFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, ViewDiaryFragment().apply{arguments=Bundle().apply{putSerializable("diary",d)}}).addToBackStack(null).commit() }
        binding.rvDiaries.layoutManager=LinearLayoutManager(requireContext()); binding.rvDiaries.adapter=adapter
        binding.btnWriteDiary.setOnClickListener { parentFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, WriteDiaryFragment()).addToBackStack(null).commit() }
        val uid=FirebaseHelper.currentUserUid?:return
        FirebaseHelper.getUserDiaryCollection(uid).orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING).addSnapshotListener { sn, err ->
            if(err!=null) return@addSnapshotListener
            list.clear(); for(d in sn?: emptyList()) list.add(d.toObject(Diary::class.java).copy(id=d.id))
            adapter.updateDiaries(list)
        }
    }
}