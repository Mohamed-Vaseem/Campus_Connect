package com.campusconnect;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CampusFlowTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void publicEventListNeedsNoLogin() throws Exception {
        mvc.perform(get("/api/events")).andExpect(status().isOk());
    }

    @Test
    void privateEndpointsRejectAnonymousUsers() throws Exception {
        mvc.perform(get("/api/students/my-registrations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/analytics")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/registrations")).andExpect(status().isUnauthorized());
    }

    @Test
    void studentSignsUpAndLogsInButCannotReachAdminEndpoints() throws Exception {
        String signup = """
                {"name":"Test Student","email":"test.student@example.com","rollNumber":"24CS999",
                 "password":"Password1","confirmPassword":"Password1"}""";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.profileComplete").value(false));

        String login = "{\"username\":\"test.student@example.com\",\"password\":\"Password1\"}";
        String response = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andReturn().getResponse().getContentAsString();
        String token = response.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/admin/registrations").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/points/mine").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void wrongPasswordIsRejectedForBothStudentAndCoordinatorUsernames() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin@broadcast\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"nobody@example.com\",\"password\":\"whatever123\"}"))
                .andExpect(status().isUnauthorized());
    }
}
