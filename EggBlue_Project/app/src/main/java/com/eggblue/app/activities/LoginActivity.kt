package com.eggblue.app.activities
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.eggblue.app.MainActivity
import com.eggblue.app.databinding.ActivityLoginBinding
import com.eggblue.app.utils.FirebaseHelper
class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        if(FirebaseHelper.currentUserUid != null) { startActivity(Intent(this, MainActivity::class.java)); finish(); return }
        binding.btnLogin.setOnClickListener {
            val e = binding.etEmail.text.toString().trim()
            val p = binding.etPassword.text.toString().trim()
            if(e.isEmpty() || p.isEmpty()) { Toast.makeText(this, "Vui lòng nhập đủ thông tin", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            FirebaseHelper.auth.signInWithEmailAndPassword(e, p).addOnCompleteListener { t ->
                if(t.isSuccessful) { startActivity(Intent(this, MainActivity::class.java)); finish() }
                else Toast.makeText(this, "Lỗi: ${t.exception?.message}", Toast.LENGTH_SHORT).show()
            }
        }
        binding.tvRegister.setOnClickListener { startActivity(Intent(this, RegisterActivity::class.java)) }
    }
}