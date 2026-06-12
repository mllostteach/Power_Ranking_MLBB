package com.eggblue.app.fragments
import android.os.Bundle; import android.view.LayoutInflater; import android.view.View; import android.view.ViewGroup
import androidx.fragment.app.Fragment; import com.eggblue.app.databinding.FragmentAiChatBinding
class AIChatFragment : Fragment() {
    private lateinit var binding: FragmentAiChatBinding
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentAiChatBinding.inflate(i,c,false); return binding.root }
}