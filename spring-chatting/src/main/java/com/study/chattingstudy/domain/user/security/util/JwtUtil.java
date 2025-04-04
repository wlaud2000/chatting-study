package com.study.chattingstudy.domain.user.security.util;

import com.study.chattingstudy.domain.user.entity.User;
import com.study.chattingstudy.domain.user.repository.UserRepository;
import com.study.chattingstudy.domain.user.security.dto.JwtDTO;
import com.study.chattingstudy.domain.user.security.userdetails.CustomUserDetails;
import com.study.chattingstudy.global.utils.RedisUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SecurityException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey; //JWT 서명에 사용되는 비밀 키
    private final Long accessExpMs; //액세스 토큰의 만료 시간
    private final Long refreshExpMs; //리프레시 토큰의 만료 시간
    private final RedisUtil redisUtil;
    private final UserRepository userRepository;

    public JwtUtil(@Value("${spring.jwt.secret}") String secret,
                   @Value("${spring.jwt.token.access-expiration-time}") Long access,
                   @Value("${spring.jwt.token.refresh-expiration-time}") Long refresh,
                   RedisUtil redisUtil,
                   UserRepository userRepository) {

        //주어진 시크릿 키 문자열을 바이트 배열로 변환하고, 이를 사용하여 SecretKey 객체 생성
        secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),
                Jwts.SIG.HS256.key().build().getAlgorithm());
        accessExpMs = access; // 액세스 토큰 만료 시간 설정
        refreshExpMs = refresh; // 리프레시 토큰 만료 시간 설정
        this.redisUtil = redisUtil;
        this.userRepository = userRepository;
    }

    //JWT 토큰을 입력으로 받아 토큰의 subject 로부터 사용자 Email 추출하는 메서드
    public String getEmail(String token) throws SignatureException {
        log.info("[ JwtUtil ] 토큰에서 이메일을 추출합니다.");
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject(); //claims의 Subject에서 사용자의 email 추출 (Subject): 토큰의 주체 (일반적으로 사용자 ID나 이메일)
    }

    //토큰을 발급하는 메서드
    public String tokenProvider(CustomUserDetails userDetails, Instant expirationTime) {

        log.info("[ JwtUtil ] 토큰을 새로 생성합니다.");

        //현재 시간
        Instant issuedAt = Instant.now();

        //토큰에 부여할 권한
        String authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(",")); //스트림의 모든 요소를 하나의 문자열로 결합

        return Jwts.builder()
                .header() //헤더 부분
                .add("typ", "JWT") //JWT 타입을 추가
                .and()
                .subject(userDetails.getUsername()) //Subject 에 username (email) 추가
                .claim("role", authorities) //권한 정보를 클레임에 추가
                .issuedAt(Date.from(issuedAt)) //발행 시간(현재 시간)을 추가
                .expiration(Date.from(expirationTime)) //만료 시간을 추가
                .signWith(secretKey) //서명 정보를 추가
                .compact(); //합치기
    }

    //JWT 액세스 토큰을 생성
    public String createJwtAccessToken(CustomUserDetails customUserDetails) {
        Instant expiration = Instant.now().plusMillis(accessExpMs);
        return tokenProvider(customUserDetails, expiration);
    }

    // principalDetails 객체에 대해 새로운 JWT 리프레시 토큰을 생성
    public String createJwtRefreshToken(CustomUserDetails customUserDetails) {
        Instant expiration = Instant.now().plusMillis(refreshExpMs);
        String refreshToken = tokenProvider(customUserDetails, expiration);

        //Refresh Token 저장
        redisUtil.save(
                customUserDetails.getUsername() + ":refresh",
                refreshToken,
                refreshExpMs,
                TimeUnit.MILLISECONDS
        );

        return refreshToken;
    }

    // 토큰의 남은 만료 시간을 계산하는 메서드
    public long getRemainingExpiration(String token) {
        try {
            Date expiration = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration();

            long remainingTime = expiration.getTime() - System.currentTimeMillis();
            return remainingTime > 0 ? remainingTime : 0;
        } catch (ExpiredJwtException e) {
            // 이미 만료된 경우 0을 반환
            return 0;
        }
    }

    // 임시 AccessToken을 생성하는 메서드
    public String createTemporaryToken(String email, long expirationTimeInMillis) {
        log.info("[ JwtUtil ] 임시 AccessToken을 생성합니다.");

        Instant issuedAt = Instant.now();
        Instant expirationTime = Instant.now().plusMillis(expirationTimeInMillis);

        // 임시 AccessToken 생성
        return Jwts.builder()
                .header()
                .add("typ", "JWT")
                .and()
                .subject(email) // Subject에 사용자 이메일 추가
                .claim("scope", "password-reset") // 특정 작업(scope)을 위한 클레임 추가
                .issuedAt(Date.from(issuedAt)) // 발행 시간
                .expiration(Date.from(expirationTime)) // 만료 시간
                .signWith(secretKey) // 서명 정보 추가
                .compact(); // 토큰 생성
    }

    //주어진 리프레시 토큰을 기반으로 새로운 액세스 토큰을 발급
    public JwtDTO reissueToken(String refreshToken) throws SignatureException {
        String email = getEmail(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        // CustomUserDetails 생성 시 User 객체 사용
        CustomUserDetails userDetails = new CustomUserDetails(user);
        log.info("[ JwtUtil ] 새로운 토큰을 재발급 합니다.");

        return new JwtDTO(
                createJwtAccessToken(userDetails),
                createJwtRefreshToken(userDetails)
        );
    }

    // HTTP 요청의 'Authorization' 헤더에서 JWT 액세스 토큰을 검색
    public String resolveAccessToken(HttpServletRequest request) {
        log.info("[ JwtUtil ] 헤더에서 토큰을 추출합니다.");
        String tokenFromHeader = request.getHeader("Authorization");

        if (tokenFromHeader == null || !tokenFromHeader.startsWith("Bearer ")) {
            log.warn("[ JwtUtil ] Request Header 에 토큰이 존재하지 않습니다.");
            return null;
        }

        log.info("[ JwtUtil ] 헤더에 토큰이 존재합니다.");

        return tokenFromHeader.split(" ")[1]; //Bearer 와 분리
    }

    //토큰의 유효성 검사
    public void validateToken(String token) {
        log.info("[ JwtUtil ] 토큰의 유효성을 검증합니다.");
        try {
            // 구문 분석 시스템의 시계가 JWT를 생성한 시스템의 시계 오차 고려
            // 약 3분 허용.
            long seconds = 3 *60;
            boolean isExpired = Jwts
                    .parser()
                    .clockSkewSeconds(seconds)
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration()
                    .before(new Date());
            if (isExpired) {
                log.info("만료된 JWT 토큰입니다.");
            }

        } catch (SecurityException | MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            //원하는 Exception throw
            throw new SecurityException("잘못된 토큰입니다.");
        } catch (ExpiredJwtException e) {
            //원하는 Exception throw
            throw new ExpiredJwtException(null, null, "만료된 JWT 토큰입니다.");
        }
    }

}
