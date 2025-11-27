library(dplyr)
library(tidyr)
library(car)
# devtools::install_github("yaowuliu/ACAT")
library(ACAT)


# set working directory
setwd("/Users/pacha/Documents/github_projects/test_tsspredatorGui/TSSpredator-GUI/statistical_testing")
read_coverage_table <- read.csv("TSS_Coverages_Ecoli.tsv", sep = "\t")


cauchy_combination <- function(pvals) {
  # avoid error for 0 or 1
  pvals[pvals > 0.999] <- 0.999
  pvals[pvals < 1e-16] <- 1e-16 
  
  p_out <- ACAT(pvals)
  return(p_out)
}


#### Test KS test on coverage values for significant TSS
ks_test_apply <- read_coverage_table %>%
    # create TSS ID, needed for uniqueness at each position
    mutate(TSS_ID = paste(SuperPos, SuperStrand, sep = "_")) %>%
    # select relevant columns
    select(Condition, TSS_ID, replicate_ID, list_as_string)

# From string to numeric vector
ks_test_apply$vector_coverage <- lapply(ks_test_apply$list_as_string, function(x) as.numeric(unlist(strsplit(as.character(x), split = ";"))))

# get relevant columns
ks_test_df <- ks_test_apply %>%
    select(Condition, TSS_ID, replicate_ID, vector_coverage) 


ks_perm_for_one_tss <- function(tss_df) {

  conditions <- unique(tss_df$Condition)
  out <- list()
  if (length(conditions) < 2) {
    # no testing if less than 2 conditions
    return(data.frame())
  }
  # For each pair of conditions
  for (i in 1:(length(conditions) - 1)) {
    for (j in (i + 1):length(conditions)) {
      g1 <- conditions[i]
      g2 <- conditions[j]

      # Extract replicate vectors
      A_list <- tss_df$vector_coverage[tss_df$Condition == g1]
      B_list <- tss_df$vector_coverage[tss_df$Condition == g2]
      p.values <- c()

      for (vec in A_list) {
        for (vec2 in B_list) {
          ks_test_result <- ks.test(vec, vec2)
          p.values <- c(p.values, ks_test_result$p.value)
        }
      }
      # Summarize p-values using Cauchy combination
      pval <- cauchy_combination(p.values)


      out[[paste(g1, "vs", g2)]] <- list(
        contrast = paste(g1, "vs", g2),
        p = pval
      )
    }
  }

  do.call(rbind, lapply(out, as.data.frame))
}

# apply test
ks_results <- ks_test_df %>%
  group_by(TSS_ID) %>%
  group_modify(~ ks_perm_for_one_tss(.x)) %>%
  ungroup() %>%
  # correct p-values
  mutate(p_adj_BH = p.adjust(p, method = "BH"),
         p_adj_Bonf = p.adjust(p, method = "bonferroni"))

ks_results_sig_BH <- ks_results %>%
  filter(p_adj_BH < 0.05) %>% 
  arrange(p_adj_BH, TSS_ID)

ks_results_sig_BH %>% nrow()

ks_results_sig_Bonf <- ks_results %>%
  filter(p_adj_Bonf < 0.05) %>%
  arrange(p_adj_Bonf, TSS_ID)
  
ks_results_sig_Bonf %>% nrow()


write.csv(ks_results_sig, "results_ks_pairwise_results_Ecoli_BH.tsv",row.names = FALSE)
write.csv(ks_results_sig_Bonf, "results_ks_pairwise_results_Ecoli_bonferroni.tsv",row.names = FALSE)
