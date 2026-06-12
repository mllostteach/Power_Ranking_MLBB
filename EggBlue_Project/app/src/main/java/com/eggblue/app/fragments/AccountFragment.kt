package com.eggblue.app.fragments
import android.app.Activity; import android.app.AlertDialog; import android.content.Intent; import android.graphics.Bitmap; import android.graphics.BitmapFactory
import android.net.Uri; import android.os.Bundle; import android.provider.MediaStore; import android.util.Base64; import android.view.LayoutInflater
import android.view.View; import android.view.ViewGroup; import android.widget.EditText; import android.widget.Toast; import androidx.fragment.app.Fragment
import com.eggblue.app.activities.LoginActivity; import com.eggblue.app.databinding.FragmentAccountBinding; import com.eggblue.app.utils.FirebaseHelper; import java.io.ByteArrayOutputStream
class AccountFragment : Fragment() {
    private lateinit var binding: FragmentAccountBinding; private var curBase64=""
    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View { binding=FragmentAccountBinding.inflate(i,c,false); return binding.root }
    override fun onViewCreated(v: View, s: Bundle?) {
        super.onViewCreated(v,s); binding.tvEmail.text=FirebaseHelper.currentUserEmail
        val uid=FirebaseHelper.currentUserUid?:return
        FirebaseHelper.db.collection("users").document(uid).addSnapshotListener { sn, err ->
            if(err!=null||sn==null||!sn.exists()) return@addSnapshotListener
            curBase64=sn.getString("avatarBase64")?:""
            if(curBase64.isNotEmpty()) { val by=Base64.decode(curBase64,Base64.DEFAULT); binding.imgAvatar.setImageBitmap(BitmapFactory.decodeByteArray(by,0,by.size)) }
        }
        binding.btnChangeAvatar.setOnClickListener { startActivityForResult(Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI), 1001) }
        binding.btnChangePassword.setOnClickListener {
            val et=EditText(requireContext()); et.hint="Mật khẩu mới"; et.inputType=android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            AlertDialog.Builder(requireContext()).setTitle("Đổi mật khẩu").setView(et).setPositiveButton("Lưu"){_,_->
                val np=et.text.toString(); if(np.length<6) { Toast.makeText(requireContext(),"≥6 ký tự",Toast.LENGTH_SHORT).show(); return@setPositiveButton }
                FirebaseHelper.currentUser?.updatePassword(np)?.addOnSuccessListener{ Toast.makeText(requireContext(),"Thành công",Toast.LENGTH_SHORT).show() }
            }.setNegativeButton("Hủy",null).show()
        }
        binding.btnLogout.setOnClickListener {
            FirebaseHelper.auth.signOut(); val i=Intent(requireContext(),LoginActivity::class.java); i.flags=Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(i); requireActivity().finish()
        }
    }
    @Deprecated("Deprecated")
    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req,res,data)
        if(req==1001 && res==Activity.RESULT_OK && data!=null) {
            val uri=data.data?:return; val inp=requireContext().contentResolver.openInputStream(uri)
            val bm=Bitmap.createScaledBitmap(BitmapFactory.decodeStream(inp),512,512,true)
            val baos=ByteArrayOutputStream(); bm.compress(Bitmap.CompressFormat.JPEG,70,baos); val b64=Base64.encodeToString(baos.toByteArray(),Base64.DEFAULT)
            binding.imgAvatar.setImageBitmap(bm)
            FirebaseHelper.db.collection("users").document(FirebaseHelper.currentUserUid!!).update("avatarBase64",b64).addOnSuccessListener{ Toast.makeText(requireContext(),"Đã cập nhật avatar",Toast.LENGTH_SHORT).show() }
        }
    }
}